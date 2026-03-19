# Add Server SSH Key to GitHub Deploy Keys

## Server SSH Public Key:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDhaCRI6yHO2MHGm7249TDkS+p1hbhr0FnCiwQZlKACscNLY+2z0KnHUOw0KpvmmUcD3uAr/eAiRw6zdC3quw9r86fjgy04p5hFjvDfXe7/aEjDicFEAPhJIQKTCQu7y9qWksPK1qzDBP8tWQk5V9vEQ4keI9m/7tYF2JxoWXajRm1gSGRHX0Lx3S6bYQ059tSHh2dShf7Miecso7AfxjMSD1AE7fGrv6FcEVh+AslwOHPHY4ZqcgEF+JGm/LvswMBzqAVQQHx+rN0At4vOAZpCDX1/eP37YMatMT34oF0RsR4w87H1csQSfmRVGh7/BgBZDh/5XZF7tZPUgQJ/F2myi35m5/cZas2CV6k4oHzf6EoupV6k39fSNFap5mh7J9eK9JsoQngZt4kW0MzSXJMbxblFypI9bzTlpdl6Qx6tEBNewfeMrGCtpZ2rwbUgYKLhB8i0HLiazLYlSNbn6BE3BUdwrSpTfKxxoMDP3I4yZW7o4ZLv726LZHgmLIM87TJRQ9bKDyE66Jk4d+9P+EEQ2BWZd20ZyBopoxfQym/sh8sn68gSlIB4ETpGxSOT2TRVJPVqUVX+9PfCInQABLiSs02DMrwi/YYrTqlZlTSb7/BgBwL5vXCN2+EduihTt3TjRIZRvaKtq8pgF5tSmQOvZPEyx98eHBckxZu8qHO/w== server@toeicai.com
```

## Steps:
1. Go to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/keys
2. Click "Add deploy key"
3. Title: "Production Server - ToeicAI"
4. Paste the SSH key above
5. Check "Allow write access" ✅
6. Click "Add key"

## Test after adding:
```bash
ssh root@144.91.104.237 "cd /var/www/toeicai/ToeicBoost_BE && git pull origin main"
```

## If successful, run full deployment:
```bash
./manual-deploy-now.sh
```