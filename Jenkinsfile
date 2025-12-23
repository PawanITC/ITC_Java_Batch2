pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '430006376054.dkr.ecr.eu-north-1.amazonaws.com'
        AWS_REGION = 'eu-north-1'
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Detect Changes') {
            steps {
                script {
                    // Get list of changed files
                    def changedFiles = sh(
                        returnStdout: true,
                        script: 'git diff --name-only HEAD~1 || git diff --name-only HEAD'
                    ).trim()
                    
                    echo "Changed files:\n${changedFiles}"
                    
                    // Detect which services changed
                    env.BUILD_TRIBETALK = changedFiles.contains('tribetalk/') ? 'true' : 'false'
                    env.BUILD_CHATSERVICE = changedFiles.contains('ChatService/') ? 'true' : 'false'
                    env.BUILD_NOTIFICATION = changedFiles.contains('notification-service/') ? 'true' : 'false'
                    env.BUILD_FRONTEND = changedFiles.contains('tribe-talk-frontend/') ? 'true' : 'false'
                    
                    echo """
                    Build Plan:
                    - TribeTalk: ${env.BUILD_TRIBETALK}
                    - ChatService: ${env.BUILD_CHATSERVICE}
                    - Notification Service: ${env.BUILD_NOTIFICATION}
                    - Frontend: ${env.BUILD_FRONTEND}
                    """
                }
            }
        }
        
        stage('Build Services') {
            parallel {
                stage('Build TribeTalk') {
                    when {
                        expression { env.BUILD_TRIBETALK == 'true' }
                    }
                    steps {
                        script {
                            buildService(
                                serviceName: 'tribetalk',
                                directory: 'tribetalk',
                                buildCommand: 'mvn clean package -DskipTests',
                                ecrRepo: 'tribetalk'
                            )
                        }
                    }
                }
                
                stage('Build ChatService') {
                    when {
                        expression { env.BUILD_CHATSERVICE == 'true' }
                    }
                    steps {
                        script {
                            buildService(
                                serviceName: 'chatservice',
                                directory: 'ChatService',
                                buildCommand: 'mvn clean package -DskipTests',
                                ecrRepo: 'chatservice'
                            )
                        }
                    }
                }
                
                stage('Build Notification Service') {
                    when {
                        expression { env.BUILD_NOTIFICATION == 'true' }
                    }
                    steps {
                        script {
                            buildService(
                                serviceName: 'notification-service',
                                directory: 'notification-service',
                                buildCommand: 'mvn clean package -DskipTests',
                                ecrRepo: 'notification-service'
                            )
                        }
                    }
                }
                
                stage('Build Frontend') {
                    when {
                        expression { env.BUILD_FRONTEND == 'true' }
                    }
                    steps {
                        script {
                            buildService(
                                serviceName: 'frontend',
                                directory: 'tribe-talk-frontend',
                                buildCommand: 'npm install && npm run build',
                                ecrRepo: 'tribe-talk-frontend'
                            )
                        }
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Build and push completed successfully!'
        }
        failure {
            echo '❌ Build or push failed!'
        }
        always {
            sh 'docker system prune -f || true'
        }
    }
}

// Helper function to build and push a service
def buildService(Map config) {
    echo "Building ${config.serviceName}..."
    
    dir(config.directory) {
        // Build application
        sh config.buildCommand
        
        // Build Docker image
        sh """
            docker build -t ${config.ecrRepo}:${BUILD_NUMBER} .
            docker tag ${config.ecrRepo}:${BUILD_NUMBER} ${ECR_REGISTRY}/${config.ecrRepo}:${BUILD_NUMBER}
            docker tag ${config.ecrRepo}:${BUILD_NUMBER} ${ECR_REGISTRY}/${config.ecrRepo}:latest
        """
        
        // Push to ECR
        sh """
            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
            docker push ${ECR_REGISTRY}/${config.ecrRepo}:${BUILD_NUMBER}
            docker push ${ECR_REGISTRY}/${config.ecrRepo}:latest
        """
        
        echo "✅ ${config.serviceName} pushed to ECR: ${ECR_REGISTRY}/${config.ecrRepo}:${BUILD_NUMBER}"
    }
}
