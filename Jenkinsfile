pipeline {
  agent any
  stages {
    stage('Stop') {
      steps {
        sh 'docker rm -f -v nip-back | exit 0'
        sh 'docker rmi nip/back | exit 0'
      }
    }
    stage('Build container') {
      steps {
        sh 'docker build -t nip/back .'
      }
    }
    stage('Run container') {
      steps {
        sh '''docker run -d --name nip-back  -v /var/lib/jenkins/workspace/blockchain_master/first-network/:/app/first-network -v /var/lib/jenkins/workspace/blockchain_master/fabcar/javascript/wallet:/app/fabcar/javascript/wallet --net=host nip/back
'''
      }
    }
  }
}
