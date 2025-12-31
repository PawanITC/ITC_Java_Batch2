FROM maven:3.9-eclipse-temurin-21
WORKDIR /app
COPY target/ChatService-0.0.1-SNAPSHOT.jar ChatService.jar
EXPOSE 8081
#ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "ChatService.jar"]