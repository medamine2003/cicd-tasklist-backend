pipeline {
    agent any

    environment {
        REGISTRY = 'docker.io'
        IMAGE_NAME = "${REGISTRY}/mohamedamine2003/tasklist-backend"
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS = 'dockerhub-credentials-exam'
        SONAR_CREDENTIALS_ID = 'projet-exam-backend-secret'
        SONAR_PROJECT_KEY = 'projet-exam-backend'
    }

    triggers {
        githubPush()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo ' Récupération du code source...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo ' Installation des dépendances...'
                sh 'npm ci --include=dev'
            }
        }

        stage('Build') {
            steps {
                echo ' Construction du projet...'
                sh 'npm run build'
            }
        }

        stage('Unit Tests') {
            steps {
                echo ' Exécution des tests unitaires...'
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit testResults: 'reports/junit.xml',
                          skipPublishingChecks: true,
                          allowEmptyResults: true
                    archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
                }
            }
        }

        stage('E2E Tests') {
            steps {
                echo ' Exécution des tests E2E...'
                sh 'npm run test:e2e:coverage'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo ' Analyse SonarQube...'
                withCredentials([string(credentialsId: "${SONAR_CREDENTIALS_ID}", variable: 'SONAR_TOKEN')]) {
                    sh '''
                        npx sonarqube-scanner \
                            -Dsonar.host.url=https://sonarqube.cicd.kits.ext.educentre.fr \
                            -Dsonar.token=${SONAR_TOKEN} \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=src \
                            -Dsonar.coverage.exclusions=**/__tests__/** \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info,coverage-e2e/lcov.info
                    '''
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                echo ' Vérification du Quality Gate...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo ' Construction de l\'image Docker...'
                sh '''
                    docker build \
                        -t ${IMAGE_NAME}:${IMAGE_TAG} \
                        -t ${IMAGE_NAME}:latest \
                        .
                '''
            }
        }

        stage('Scan with Trivy') {
            steps {
                echo ' Analyse de sécurité Trivy...'
                sh '''
                    trivy image \
                        --format json \
                        --output trivy-report.json \
                        --severity HIGH,CRITICAL \
                        ${IMAGE_NAME}:${IMAGE_TAG} || true

                    trivy image \
                        --format table \
                        --severity HIGH,CRITICAL \
                        ${IMAGE_NAME}:${IMAGE_TAG} || true
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
                }
            }
        }

        stage('Generate SBOM') {
            steps {
                echo ' Génération du SBOM...'
                sh '''
                    trivy image \
                        --format spdx-json \
                        --output sbom-spdx.json \
                        ${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'sbom-spdx.json', allowEmptyArchive: true
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                echo ' Push vers DockerHub...'
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS}",
                                                   usernameVariable: 'DOCKER_USER',
                                                   passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        always {
            echo ' Nettoyage...'
            cleanWs()
        }

        success {
            echo ' Build réussi!'
        }

        failure {
            echo ' Build échoué!'
        }
    }
}
