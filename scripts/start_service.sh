#!/bin/bash

echo 'Starting explorer service'

cd /opt/whitney-ethereum-service/express
npm install

# Create/Run Whitney-ethereum-service
echo "export WhitneyEthereumService=/etc/systemd/system/whitney_ethereum.service" >> /etc/profile.d/whitney_env_var.sh
. /etc/profile.d/whitney_env_var.sh
cat > ${WhitneyEthereumService} <<EOF
[Unit]
Description=Geth service
After=network.target

[Service]
Type=simple
Restart=always
User=root
ExecStart=/bin/bash -c 'NODE_ENV=${NODE_ENV} LOG=debug `which node` /opt/whitney-ethereum-service/express/API/RestApi.js'

[Install]
WantedBy=multi-user.target
EOF


systemctl enable whitney_ethereum.service

systemctl restart whitney_ethereum.service
