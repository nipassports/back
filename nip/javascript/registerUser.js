/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function registeruser(orgnum,departnum) {

  const ccpPath = path.resolve(__dirname, '..', '..', 'nip-network', 'connection'+orgnum+'.json');
  const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
  const ccp = JSON.parse(ccpJSON);



    try {


        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user'+orgnum);
        if (userExists) {
            console.log('An identity for the user "user'+orgnum+'" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin'+orgnum);
        if (!adminExists) {
            console.log('An identity for the admin user "admin'+orgnum+'" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();

        await gateway.connect(ccp, { wallet, identity: 'admin'+orgnum, discovery: { enabled: false } });
        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: 'org'+orgnum+'.department'+departnum, enrollmentID: 'user'+orgnum, role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: 'user'+orgnum, enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('Org'+orgnum+'MSP', enrollment.certificate, enrollment.key.toBytes());
        wallet.import('user'+orgnum, userIdentity);
        console.log('Successfully registered and enrolled admin user "user'+orgnum+'" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "user`+orgnum+`": ${error}`);
        process.exit(1);
    }
}


async function main() {
    try {
      //departmentnum=1 ou 2 && orgnum= 1 2 ou 3
      registeruser('1','1','1');
      registeruser('2','1','1');
      registeruser('3','1','1');

    } catch (error) {
        console.error(`Failed to register user "user1": ${error}`);
        process.exit(1);
    }
}

main();
