# Check GitHub Secrets

## Cần kiểm tra các secrets sau:

### 1. SERVER_HOST
- Giá trị: `144.91.104.237`
- Kiểm tra: Ping server để đảm bảo accessible

### 2. SERVER_USER  
- Giá trị: `root`
- Kiểm tra: Đảm bảo user có quyền SSH

### 3. SERVER_SSH_KEY
- Giá trị: Private key (bắt đầu với `-----BEGIN OPENSSH PRIVATE KEY-----`)
- Kiểm tra: 
  - Đảm bảo copy đúng toàn bộ key (bao gồm BEGIN/END lines)
  - Không có khoảng trắng thừa
  - Public key tương ứng đã được thêm vào server

## Các bước kiểm tra:

1. **Test ping server:**
   ```bash
   ping 144.91.104.237
   ```

2. **Test SSH từ local:**
   ```bash
   ssh -i ~/.ssh/toeicai_actions root@144.91.104.237 "echo 'Test successful'"
   ```

3. **Kiểm tra public key trên server:**
   ```bash
   ssh root@144.91.104.237
   cat ~/.ssh/authorized_keys | grep "actions-"
   ```

4. **Kiểm tra GitHub Deploy Key:**
   - Vào: https://github.com/NhomNCKH/ToeicBoost_BE/settings/keys
   - Đảm bảo key có "Allow write access" được check

## Nếu vẫn lỗi, thử các bước sau:

1. **Regenerate SSH keys:**
   ```bash
   ./fix-ssh-complete.sh
   ```

2. **Update GitHub Secrets với keys mới**

3. **Test lại SSH connection**