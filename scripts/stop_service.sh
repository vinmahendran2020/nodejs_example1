#!/bin/bash

echo 'Trying to stop explorer service'
systemctl stop whitney_ethereum.service
systemctl disable whitney_ethereum.service
exit 0
