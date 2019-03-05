pipeline {
  agent any
  stages {
    stage('Stop') {
      steps {
        sh 'kill -SIGINT $(ps -au | grep "node server.js" | head -n 1 | cut -d" " -f2) | exit 0'
      }
    }
    stage('Create link to HL') {
      steps {
        sh './createSymLinkToHL.sh'
      }
    }
    stage('Actions') {
      steps {
        sh './actionsBeforeServLaunch.sh'
      }
    }
    stage('Start') {
      steps {
        sh 'cd fabcar/javascript && node server.js &'
      }
    }
  }
}