# SSH Setup Checklist

## ✅ COMPLETED
- SSH keys created locally
- Local SSH connection tested and working

## 🔄 TODO - Follow these steps:

### Step 1: Add public key to server
SSH to your server and run:
```bash
ssh root@144.91.104.237
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC+XjZS50Cx21x+paXQfkNStC+Q097tnhUEW91nbXUH2uRxi6M8dV9D9gXDuNjfSYKoczTVsYmhRZJGc576oc66K4ayRMSzsmWk0Z19e/DnhhJo4mqy4DTKXmlsXbl0dF/QQSeleYeptt2wedvcU6c6463Cp6uEkUDD+UlG7RVcAvENQd4vhHV7GY66GJCALkJtpA0rNkSESDjMLUAbkAihzE3hyZeIYnDa50KoRJtCDrwE4gg6RTez1D4u8GDAuNCp+e0Hd3+fcC2PBuNr9zcV1DLdfuTIIbJM2xv6zV8fo3Dahb8VLOGr+v/K/W1/IoE+TW3CzGvAS/se0+GGDb66Fsh02MIXtlts4eqoTu046sOz4hW664AM6uU0j1U+Y0TlSRNZPV2fNJnBjpRRjYcZccgqu50KeJt5Qd5j/dOuRQoGiD6ULOeGKdOPbTuZjWeO9zeeI3VT8RsMC7eSfoktslm8noMSLkrXrg+RoHbK87o1hYacTuTNF1DtWFGBOoWKdvvviOEvM1S9vycUh4lngApF+tQLI9lZBgfOWis7gZLTrBemg9tK4vdBeTtCTawybAilB1lzvvIM++xOgyIAI+Um9CDX0SSvkOEotjPHpnGfkuTMb822gK/Gv/c5qRxhT+DIBrHJban5VECILSLI8sL9WiJ4p5XuR9+NeOeR7Q== actions-1773995751" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### Step 2: Add GitHub Deploy Key
1. Go to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/keys
2. Click "Add deploy key"
3. Title: "Server Deploy Key"
4. Paste this public key:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDmn9YCY+9hirL30Kn0IOWCSdtHhhGPOn4i1u3EmB0D0QAxZF2mKLHC4EljmHnsbACOb3x4V8Sq7uligrXqHTZcaSbn/rJwI4FLAaKlxjZIlcv6AhAXXb9P1R6KZEwKtrGg9wg+cUu+agN00y/WZWCYwxeVACSiFD9ZoEBBBFW3v2I8efW9O5cL6lBVS2JojO+UIFSlkEVNedbemNZfxYrxbTILhfHDnhDRF6OkmVFoi059kjSPh+W1m34z6/kbeqaWRrK6QnXFKeSgIBMVLehDXWt4rzJvXarIBja6f5ZxPeNEsvgDECzzNStqqS9pu5MFdhcd+uF7xtXXKClQCRh8s4y/j5PPlZmteofun9jih4RK5ll/jyW7zanwecstEW0K+6XK4TmX+c97NqA67f8hddgtqP2rQsWZA177ZcKATDmOywreANhLqgvFMwxEwt8IDm2gP4R3ZeC/4gYmYWlA4E/7xZm4xFz9DwB0B4rI62o3Kl5qRliGxrtxkj87yUg/IHHcB20DB7Simc4xt9T4dIaxqfsHZ0WlM/MdIa1TinOIRAcERLrRZZLeUJzDXt7X+ki2nCuJZ7FD595yA/i7kqTkPbPphNtzGN3cWRhkgnrKXiST56Mq/NfKmaPUmzIujZcLu3xiuKSWS2ypRKhdx2SML/XDr8mHHZftN3IxqQ== server-github-1773995753
```
5. Check "Allow write access"
6. Click "Add key"

### Step 3: Add GitHub Secrets
Go to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/secrets/actions

Add these secrets:
- `SERVER_HOST`: `144.91.104.237`
- `SERVER_USER`: `root`
- `SERVER_SSH_KEY`: Copy the private key from `~/.ssh/toeicai_actions`

### Step 4: Setup server GitHub access
See the full script output for the complete private key and SSH config setup.

## Test when done:
```bash
ssh -i ~/.ssh/toeicai_actions root@144.91.104.237 "echo 'Success!'"
```# SSH Setup Complete - Fri Mar 20 15:51:31 +07 2026
