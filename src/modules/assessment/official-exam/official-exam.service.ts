import { BadRequestException, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PayOS } from '@payos/node';
import { TemplateMode, TemplateStatus } from '@common/constants/exam-template.enum';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import {
  OfficialExamRegistration,
  OfficialExamRegistrationStatus,
} from './entities/official-exam-registration.entity';
import { User } from '@modules/security/entities/user.entity';
import { MailerService } from '@modules/notification/services/mailer.service';
import { RegisterOfficialExamDto } from './dto/official-exam.dto';

function formatDateVi(d: Date) {
  // dd/mm/yyyy
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function buildEmailShell(opts: { title: string; preheader?: string; bodyHtml: string }) {
  const preheader = opts.preheader ?? '';
  // Inline CSS for email client compatibility
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${opts.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:0 24px;">
                <div style="height:5px;background:#f59e0b;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 18px 24px;background:#ffffff;border-bottom:1px solid #e5e7eb;">
                <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#fff7ed;color:#9a3412;font-size:11px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;">
                  Official Exam
                </div>
                <div style="margin-top:14px;font-weight:800;color:#0f172a;font-size:24px;letter-spacing:-.3px;">ToeicBoost</div>
                <div style="margin-top:6px;color:#475569;font-size:14px;line-height:1.6;">
                  Thông báo đăng ký và lịch thi chứng chỉ TOEIC.
                </div>
                <div style="margin-top:16px;font-size:12px;color:#94a3b8;">
                  Email tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 24px 24px 24px;background:#ffffff;">
                ${opts.bodyHtml}
                <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;line-height:1.7;">
                  Nếu bạn không thực hiện hành động này, bạn có thể bỏ qua email này.
                  <br />© ${new Date().getFullYear()} ToeicBoost. All rights reserved.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildRegistrationConfirmationEmail(payload: {
  learnerName: string;
  templateCode: string;
  templateName: string;
  examDate: Date;
  durationMin: number;
  totalQuestions: number;
}) {
  const dateLabel = formatDateVi(payload.examDate);
  const body = `
    <div style="color:#0f172a;">
      <div style="font-size:28px;font-weight:800;letter-spacing:-.4px;line-height:1.3;">Xác nhận đăng ký thi chứng chỉ</div>
      <div style="margin-top:10px;color:#475569;font-size:15px;line-height:1.8;">
        Chào <strong style="color:#0f172a;">${payload.learnerName || 'bạn'}</strong>, bạn đã đăng ký thành công suất thi vào ngày <strong style="color:#0f172a;">${dateLabel}</strong>.
      </div>

      <div style="margin-top:20px;border:1px solid #e5e7eb;border-radius:18px;background:#f8fafc;padding:18px;">
        <div style="font-size:12px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:#b45309;">Thông tin suất thi</div>
        <div style="margin-top:8px;font-size:20px;font-weight:800;color:#0f172a;line-height:1.4;">
          ${payload.templateName}
        </div>
        <div style="margin-top:4px;color:#64748b;font-size:13px;">
          Mã đề: ${payload.templateCode}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;color:#0f172a;font-size:14px;">
          <tr>
            <td style="padding:10px 0;color:#64748b;width:38%;border-top:1px solid #e2e8f0;">Ngày thi</td>
            <td style="padding:10px 0;font-weight:700;border-top:1px solid #e2e8f0;">${dateLabel}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;border-top:1px solid #e2e8f0;">Giờ nhắc thi</td>
            <td style="padding:10px 0;font-weight:700;border-top:1px solid #e2e8f0;">07:00 (sáng)</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;border-top:1px solid #e2e8f0;">Thời lượng</td>
            <td style="padding:10px 0;font-weight:700;border-top:1px solid #e2e8f0;">${payload.durationMin} phút</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;border-top:1px solid #e2e8f0;">Tổng số câu</td>
            <td style="padding:10px 0;font-weight:700;border-top:1px solid #e2e8f0;">${payload.totalQuestions} câu</td>
          </tr>
        </table>
      </div>

      <div style="margin-top:18px;border:1px solid #fde68a;background:#fffbeb;padding:16px;border-radius:16px;color:#78350f;font-size:14px;line-height:1.8;">
        <div style="font-weight:800;color:#92400e;margin-bottom:6px;">Lưu ý quan trọng</div>
        Hệ thống sẽ gửi email nhắc thi vào <strong>07:00</strong> sáng ngày thi.
        Vui lòng kiểm tra hộp thư đến và mục Spam/Quảng cáo để không bỏ lỡ thông báo.
      </div>
    </div>
  `;

  return buildEmailShell({
    title: 'Xác nhận đăng ký thi chứng chỉ',
    preheader: `Bạn đã đăng ký suất thi ngày ${dateLabel}.`,
    bodyHtml: body,
  });
}

function buildReminderEmail(payload: {
  learnerName: string;
  templateCode: string;
  templateName: string;
  examDate: Date;
  durationMin: number;
  totalQuestions: number;
}) {
  const dateLabel = formatDateVi(payload.examDate);
  const body = `
    <div style="color:#0f172a;">
      <div style="font-size:28px;font-weight:800;letter-spacing:-.4px;line-height:1.3;">Nhắc thi hôm nay</div>
      <div style="margin-top:10px;color:#475569;font-size:15px;line-height:1.8;">
        Chào <strong style="color:#0f172a;">${payload.learnerName || 'bạn'}</strong>, hôm nay (<strong style="color:#0f172a;">${dateLabel}</strong>) là ngày thi chứng chỉ bạn đã đăng ký.
      </div>

      <div style="margin-top:20px;border:1px solid #e5e7eb;border-radius:18px;background:#f8fafc;padding:18px;">
        <div style="font-size:12px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:#b45309;">Thông tin nhanh</div>
        <div style="margin-top:8px;font-size:20px;font-weight:800;color:#0f172a;line-height:1.4;">
          ${payload.templateName}
        </div>
        <div style="margin-top:4px;color:#64748b;font-size:13px;">Mã đề: ${payload.templateCode}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;color:#0f172a;font-size:14px;">
          <tr>
            <td style="padding:10px 0;color:#64748b;width:38%;border-top:1px solid #e2e8f0;">Ngày thi</td>
            <td style="padding:10px 0;font-weight:700;border-top:1px solid #e2e8f0;">${dateLabel}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;border-top:1px solid #e2e8f0;">Thời lượng</td>
            <td style="padding:10px 0;font-weight:700;border-top:1px solid #e2e8f0;">${payload.durationMin} phút</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;border-top:1px solid #e2e8f0;">Tổng số câu</td>
            <td style="padding:10px 0;font-weight:700;border-top:1px solid #e2e8f0;">${payload.totalQuestions} câu</td>
          </tr>
        </table>
      </div>

      <div style="margin-top:18px;">
        <div style="border:1px solid #dbeafe;border-radius:16px;background:#f8fbff;padding:16px;">
          <div style="font-weight:800;color:#1d4ed8;margin-bottom:8px;">Chuẩn bị trước giờ thi</div>
          <div style="color:#334155;font-size:14px;line-height:1.8;">
            - Kết nối mạng ổn định<br />
            - Thiết bị làm bài và tai nghe nếu cần<br />
            - Không gian yên tĩnh, đủ tập trung
          </div>
        </div>
      </div>

      <div style="margin-top:14px;border:1px solid #fde68a;background:#fffbeb;padding:16px;border-radius:16px;color:#78350f;font-size:14px;line-height:1.8;">
        <div style="font-weight:800;color:#92400e;margin-bottom:6px;">Khuyến nghị</div>
        Hãy vào sớm vài phút để kiểm tra âm thanh, kết nối và giao diện làm bài trước khi bắt đầu.
      </div>
      
      <div style="margin-top:14px;padding:14px 16px;border-radius:16px;background:#f8fafc;border:1px solid #e5e7eb;color:#475569;font-size:13px;line-height:1.7;">
        Nếu bạn đã hoàn tất chuẩn bị, bạn chỉ cần theo dõi email nhắc thi và vào hệ thống đúng giờ.
      </div>
    </div>
  `;

  return buildEmailShell({
    title: 'Nhắc thi hôm nay',
    preheader: `Hôm nay (${dateLabel}) là ngày thi bạn đã đăng ký.`,
    bodyHtml: body,
  });
}

@Injectable()
export class OfficialExamService {
  private readonly logger = new Logger(OfficialExamService.name);
  private readonly examFeeVnd = 10_000;

  constructor(
    @InjectRepository(ExamTemplate)
    private readonly examTemplateRepository: Repository<ExamTemplate>,
    @InjectRepository(OfficialExamRegistration)
    private readonly registrationRepository: Repository<OfficialExamRegistration>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailer: MailerService,
  ) {}

  async createRegistrationPaymentLink(
    userId: string,
    dto: RegisterOfficialExamDto,
  ) {
    const examTemplateId = dto.examTemplateId;
    const [user, template] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.examTemplateRepository.findOne({ where: { id: examTemplateId } }),
    ]);

    if (!user) throw new BadRequestException('User not found');
    if (!template) throw new BadRequestException('Exam template not found');
    if (template.status !== TemplateStatus.PUBLISHED) {
      throw new BadRequestException('Exam template is not published');
    }
    if (template.mode !== TemplateMode.OFFICIAL_EXAM) {
      throw new BadRequestException('Only official_exam can be registered');
    }
    if (!template.examDate) {
      throw new BadRequestException(
        'This official exam has no examDate configured',
      );
    }

    const now = new Date();
    const examDate = new Date(template.examDate);
    if (endOfLocalDay(examDate) < startOfLocalDay(now)) {
      throw new BadRequestException('Cannot register for a past exam date');
    }

    const existing = await this.registrationRepository.findOne({
      where: { userId, examTemplateId: template.id },
    });

    if (existing && existing.status === OfficialExamRegistrationStatus.REGISTERED) {
      return {
        alreadyRegistered: true,
        registrationId: existing.id,
        examDate: examDate.toISOString(),
        checkoutUrl: null,
        amount: this.examFeeVnd,
      };
    }

    const profileSnapshot = this.buildCertificateProfileSnapshot(user, dto.profile);
    if (profileSnapshot) {
      user.name = profileSnapshot.fullName || user.name;
      user.phone = profileSnapshot.phone || null;
      user.birthday = profileSnapshot.birthday || null;
      user.address = profileSnapshot.address || null;
      if (profileSnapshot.avatarUrl) {
        user.avatarUrl = profileSnapshot.avatarUrl;
      }
      if (profileSnapshot.avatarS3Key) {
        user.avatarS3Key = profileSnapshot.avatarS3Key;
      }
      await this.userRepository.save(user);
    }

    const payOS = this.createPayOSClient();
    const orderCode = Number(String(Date.now()).slice(-10));
    const frontendBase = this.getFrontendBaseUrl();
    const returnUrl = `${frontendBase}/student/certificates/history`;
    const cancelUrl = `${frontendBase}/student/certificates/register`;

    const paymentLink = await payOS.paymentRequests.create({
      orderCode,
      amount: this.examFeeVnd,
      description: `Le phi thi ${template.code}`.slice(0, 25),
      returnUrl,
      cancelUrl,
      items: [
        {
          name: `${template.code} - Le phi thi`,
          quantity: 1,
          price: this.examFeeVnd,
        },
      ],
      buyerName: user.name || 'Thi sinh',
      buyerEmail: user.email,
      expiredAt: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    return {
      alreadyRegistered: false,
      registrationId: null,
      examDate: examDate.toISOString(),
      orderCode,
      amount: this.examFeeVnd,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: (paymentLink as any)?.qrCode ?? null,
    };
  }

  async listAvailableSessions() {
    const templates = await this.examTemplateRepository.find({
      where: {
        status: TemplateStatus.PUBLISHED,
        mode: TemplateMode.OFFICIAL_EXAM,
      },
      order: { examDate: 'ASC' as any, publishedAt: 'DESC' as any },
    });

    const sessions = templates
      .filter((t) => !!t.examDate)
      .map((t) => ({
        examDate: (t.examDate as Date).toISOString(),
        template: {
          id: t.id,
          code: t.code,
          name: t.name,
          totalDurationSec: t.totalDurationSec,
          totalQuestions: t.totalQuestions,
        },
      }));

    // Group by date (yyyy-mm-dd local) for UI convenience
    const map = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const d = new Date(s.examDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }

    return {
      dates: [...map.entries()].map(([date, items]) => ({
        date,
        sessions: items,
      })),
    };
  }

  async register(userId: string, dto: RegisterOfficialExamDto) {
    const examTemplateId = dto.examTemplateId;
    const [user, template] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.examTemplateRepository.findOne({ where: { id: examTemplateId } }),
    ]);

    if (!user) throw new BadRequestException('User not found');
    if (!template) throw new BadRequestException('Exam template not found');

    if (template.status !== TemplateStatus.PUBLISHED) {
      throw new BadRequestException('Exam template is not published');
    }
    if (template.mode !== TemplateMode.OFFICIAL_EXAM) {
      throw new BadRequestException('Only official_exam can be registered');
    }
    if (!template.examDate) {
      throw new BadRequestException('This official exam has no examDate configured');
    }

    const now = new Date();
    const examDate = new Date(template.examDate);
    if (endOfLocalDay(examDate) < startOfLocalDay(now)) {
      throw new BadRequestException('Cannot register for a past exam date');
    }

    const profileSnapshot = this.buildCertificateProfileSnapshot(user, dto.profile);
    if (profileSnapshot) {
      user.name = profileSnapshot.fullName || user.name;
      user.phone = profileSnapshot.phone || null;
      user.birthday = profileSnapshot.birthday || null;
      user.address = profileSnapshot.address || null;
      if (profileSnapshot.avatarUrl) {
        user.avatarUrl = profileSnapshot.avatarUrl;
      }
      if (profileSnapshot.avatarS3Key) {
        user.avatarS3Key = profileSnapshot.avatarS3Key;
      }
      await this.userRepository.save(user);
    }

    const existing = await this.registrationRepository.findOne({
      where: { userId, examTemplateId: template.id },
    });

    if (existing && existing.status === 'registered') {
      // Nếu đã đăng ký nhưng trước đó chưa gửi được email xác nhận, thử gửi lại (best-effort)
      if (profileSnapshot) {
        await this.registrationRepository.update(existing.id, {
          metadata: {
            ...(existing.metadata ?? {}),
            certificateProfile: profileSnapshot,
            certificateProfileUpdatedAt: now.toISOString(),
          },
        });
        (existing.metadata as any) = {
          ...(existing.metadata ?? {}),
          certificateProfile: profileSnapshot,
          certificateProfileUpdatedAt: now.toISOString(),
        };
      }

      if (!existing.confirmationSentAt && user.email) {
        const html = buildRegistrationConfirmationEmail({
          learnerName: user.name ?? '',
          templateCode: template.code,
          templateName: template.name,
          examDate,
          durationMin: Math.round((template.totalDurationSec ?? 0) / 60),
          totalQuestions: template.totalQuestions ?? 0,
        });

        try {
          await this.mailer.sendMail({
            to: user.email,
            subject: `Xác nhận đăng ký thi chứng chỉ — ${formatDateVi(examDate)}`,
            html,
            text: `Bạn đã đăng ký thành công suất thi ngày ${formatDateVi(examDate)}.`,
          });
          await this.registrationRepository.update(existing.id, {
            confirmationSentAt: new Date(),
            metadata: {
              ...(existing.metadata ?? {}),
              confirmationEmailError: '',
              confirmationEmailResentAt: new Date().toISOString(),
            },
          });
          existing.confirmationSentAt = new Date();
          (existing.metadata as any) = {
            ...(existing.metadata ?? {}),
            confirmationEmailError: null,
          };
        } catch (e) {
          const err = e instanceof Error ? e.message : String(e);
          this.logger.warn(
            `Resend confirmation email failed for reg=${existing.id}, to=${user.email}: ${err}`,
          );
          await this.registrationRepository.update(existing.id, {
            metadata: {
              ...(existing.metadata ?? {}),
              confirmationEmailError: err,
              confirmationEmailFailedAt: new Date().toISOString(),
            },
          });
          (existing.metadata as any) = {
            ...(existing.metadata ?? {}),
            confirmationEmailError: err,
          };
        }
      }

      return {
        registered: true,
        alreadyRegistered: true,
        registrationId: existing.id,
        examDate: examDate.toISOString(),
        emailSent: Boolean(existing.confirmationSentAt),
        emailError:
          !existing.confirmationSentAt &&
          (existing.metadata as any)?.confirmationEmailError
            ? String((existing.metadata as any).confirmationEmailError || '')
            : null,
      };
    }

    const reg =
      existing ??
      this.registrationRepository.create({
        createdById: userId,
        userId,
        examTemplateId: template.id,
        status: OfficialExamRegistrationStatus.REGISTERED,
        examDate,
        registeredAt: now,
        confirmationSentAt: null,
        reminderSentAt: null,
        metadata: profileSnapshot
          ? {
              certificateProfile: profileSnapshot,
              certificateProfileUpdatedAt: now.toISOString(),
            }
          : {},
      });

    if (existing) {
      reg.status = OfficialExamRegistrationStatus.REGISTERED;
      reg.registeredAt = now;
      reg.examDate = examDate;
      reg.reminderSentAt = null;
      if (profileSnapshot) {
        reg.metadata = {
          ...(existing.metadata ?? {}),
          certificateProfile: profileSnapshot,
          certificateProfileUpdatedAt: now.toISOString(),
        };
      }
    }

    const saved = await this.registrationRepository.save(reg);

    // Send confirmation email (best-effort)
    let emailSent = false;
    let emailError: string | null = null;
    if (user.email) {
      const html = buildRegistrationConfirmationEmail({
        learnerName: user.name ?? '',
        templateCode: template.code,
        templateName: template.name,
        examDate,
        durationMin: Math.round((template.totalDurationSec ?? 0) / 60),
        totalQuestions: template.totalQuestions ?? 0,
      });

      try {
        await this.mailer.sendMail({
          to: user.email,
          subject: `Xác nhận đăng ký thi chứng chỉ — ${formatDateVi(examDate)}`,
          html,
          text: `Bạn đã đăng ký thành công suất thi ngày ${formatDateVi(examDate)}.`,
        });
        emailSent = true;
        await this.registrationRepository.update(saved.id, {
          confirmationSentAt: new Date(),
        });
      } catch (e) {
        // Không chặn đăng ký nếu SMTP lỗi (learner vẫn đăng ký thành công)
        emailSent = false;
        emailError = e instanceof Error ? e.message : String(e);
        this.logger.warn(
          `Send confirmation email failed for reg=${saved.id}, to=${user.email}: ${emailError}`,
        );

        // Lưu lỗi để learner/admin dễ debug trong lịch sử
        await this.registrationRepository.update(saved.id, {
          metadata: {
            ...(saved.metadata ?? {}),
            confirmationEmailError: emailError,
            confirmationEmailFailedAt: new Date().toISOString(),
          },
        });
      }
    }

    return {
      registered: true,
      alreadyRegistered: false,
      registrationId: saved.id,
      examDate: examDate.toISOString(),
      emailSent,
      emailError,
    };
  }

  private buildCertificateProfileSnapshot(
    user: User,
    profile?: RegisterOfficialExamDto['profile'],
  ) {
    if (!profile) return null;

    const fullName = profile.fullName?.trim() || user.name || '';
    const identityNumber = profile.identityNumber?.trim() || '';
    const birthday = profile.birthday?.trim() || user.birthday || '';
    const phone = profile.phone?.trim() || user.phone || '';
    const address = profile.address?.trim() || user.address || '';
    const avatarUrl = profile.avatarUrl?.trim() || user.avatarUrl || '';
    const avatarS3Key =
      profile.avatarS3Key?.trim() ||
      user.avatarS3Key ||
      this.deriveS3KeyFromAvatarUrl(avatarUrl);

    return {
      fullName,
      identityNumber,
      birthday,
      phone,
      address,
      avatarUrl,
      avatarS3Key,
      email: user.email || '',
      capturedAt: new Date().toISOString(),
    };
  }

  private deriveS3KeyFromAvatarUrl(avatarUrl?: string | null) {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('avatars/')) return avatarUrl;

    try {
      const url = new URL(avatarUrl);
      const pathname = decodeURIComponent(url.pathname || '').replace(/^\/+/, '');
      return pathname.startsWith('avatars/') ? pathname : '';
    } catch {
      return '';
    }
  }

  private createPayOSClient() {
    const clientId = process.env.PAYOS_CLIENT_ID?.trim();
    const apiKey = process.env.PAYOS_API_KEY?.trim();
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();
    if (!clientId || !apiKey || !checksumKey) {
      throw new BadRequestException(
        'PAYOS is not configured. Please provide PAYOS_CLIENT_ID, PAYOS_API_KEY and PAYOS_CHECKSUM_KEY',
      );
    }

    return new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
  }

  private getFrontendBaseUrl() {
    const raw =
      process.env.FRONTEND_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.APP_URL?.trim() ||
      'http://localhost:3000';
    return raw.replace(/\/$/, '');
  }

  async listMyRegistrations(userId: string) {
    const regs = await this.registrationRepository.find({
      where: { userId },
      relations: { examTemplate: true },
      order: { registeredAt: 'DESC' as any },
    });

    return {
      items: regs.map((r) => ({
        id: r.id,
        status: r.status,
        examDate: r.examDate?.toISOString?.() ?? new Date(r.examDate).toISOString(),
        registeredAt: r.registeredAt?.toISOString?.() ?? new Date(r.registeredAt).toISOString(),
        confirmationSentAt: r.confirmationSentAt ? r.confirmationSentAt.toISOString() : null,
        reminderSentAt: r.reminderSentAt ? r.reminderSentAt.toISOString() : null,
        emailError:
          !r.confirmationSentAt &&
          (r.metadata as any)?.confirmationEmailError
            ? String((r.metadata as any).confirmationEmailError || '')
            : null,
        registrationProfile: (r.metadata as any)?.certificateProfile
          ? {
              fullName:
                String((r.metadata as any)?.certificateProfile?.fullName || ''),
              identityNumber: String(
                (r.metadata as any)?.certificateProfile?.identityNumber || '',
              ),
              birthday: String(
                (r.metadata as any)?.certificateProfile?.birthday || '',
              ),
              phone: String((r.metadata as any)?.certificateProfile?.phone || ''),
              address: String(
                (r.metadata as any)?.certificateProfile?.address || '',
              ),
              avatarUrl: String(
                (r.metadata as any)?.certificateProfile?.avatarUrl || '',
              ),
              avatarS3Key: String(
                (r.metadata as any)?.certificateProfile?.avatarS3Key ||
                  this.deriveS3KeyFromAvatarUrl(
                    (r.metadata as any)?.certificateProfile?.avatarUrl || '',
                  ) ||
                  '',
              ),
            }
          : null,
        template: r.examTemplate
          ? {
              id: r.examTemplate.id,
              code: r.examTemplate.code,
              name: r.examTemplate.name,
              totalDurationSec: r.examTemplate.totalDurationSec,
              totalQuestions: r.examTemplate.totalQuestions,
            }
          : null,
      })),
    };
  }

  async sendTodayReminders(now = new Date()) {
    const dayStart = startOfLocalDay(now);
    const dayEnd = endOfLocalDay(now);

    const regs = await this.registrationRepository.find({
      where: {
        status: OfficialExamRegistrationStatus.REGISTERED,
        reminderSentAt: IsNull(),
      },
      relations: {
        user: true,
        examTemplate: true,
      },
    });

    const due = regs.filter(
      (r) => r.examDate >= dayStart && r.examDate <= dayEnd,
    );

    for (const r of due) {
      const user = r.user;
      const tpl = r.examTemplate;
      if (!user?.email || !tpl) continue;

      const html = buildReminderEmail({
        learnerName: user.name ?? '',
        templateCode: tpl.code,
        templateName: tpl.name,
        examDate: r.examDate,
        durationMin: Math.round((tpl.totalDurationSec ?? 0) / 60),
        totalQuestions: tpl.totalQuestions ?? 0,
      });

      await this.mailer.sendMail({
        to: user.email,
        subject: `Nhắc thi hôm nay — ${formatDateVi(r.examDate)}`,
        html,
        text: `Hôm nay (${formatDateVi(r.examDate)}) là ngày thi bạn đã đăng ký.`,
      });

      await this.registrationRepository.update(r.id, {
        reminderSentAt: new Date(),
      });
    }

    return { processed: due.length };
  }
}
