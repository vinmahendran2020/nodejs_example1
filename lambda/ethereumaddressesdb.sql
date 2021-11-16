CREATE TABLE ethereumAddresses ( 
    walletProvider VARCHAR(36),  
    address VARCHAR(42) UNIQUE, 
    addressID BIGINT(19) AUTO_INCREMENT PRIMARY KEY,
    tradingVenue BOOLEAN not null DEFAULT FALSE
); 
CREATE TABLE contractAddressMapping ( 
  	tsin INT(9)  PRIMARY KEY, 
    contractAddress VARCHAR(42)
); 