/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');


async function enrolladmin(orgnum, enrollmentid,enrollmentsecret){
  try {

    const ccpPath = path.resolve(__dirname, '..', '..', 'nip-network', 'connection'+orgnum+'.json');
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);

      // Create a new CA client for interacting with the CA.
      const caURL = ccp.certificateAuthorities['ca.org'+orgnum+'.nip.ddns.net'].url;
      const ca = new FabricCAServices(caURL);

      // Create a new file system based wallet for managing identities.
      const walletPath = path.join(process.cwd(), 'wallet');
      const wallet = new FileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);

      // Check to see if we've already enrolled the admin user.
      const adminExists = await wallet.exists('admin'+orgnum);
      if (adminExists) {
          console.log('An identity for the admin user "admin'+orgnum+'" already exists in the wallet');
          return;
      }

      // Enroll the admin user, and import the new identity into the wallet.
      const enrollment = await ca.enroll({ enrollmentID: enrollmentid, enrollmentSecret:  enrollmentsecret });
      const identity = X509WalletMixin.createIdentity('Org'+orgnum+'MSP', enrollment.certificate, enrollment.key.toBytes());
      wallet.import('admin'+orgnum, identity);
      console.log('Successfully enrolled admin user "admin'+orgnum+'" and imported it into the wallet');

  } catch (error) {
      console.error(`Failed to enroll admin user "admin`+orgnum+`": ${error}`);
      process.exit(1);
  }


}


async function main() {
   try {
     enrolladmin('1','admin','adminpw');
     enrolladmin('2','admin','adminpw');
     enrolladmin('3','admin','adminpw');


    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }

}

main();
