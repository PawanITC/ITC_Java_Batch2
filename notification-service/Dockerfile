FROM maven:3.9-eclipse-temurin-21
WORKDIR /app
COPY target/notification-service-0.0.1-SNAPSHOT.jar notification-service.jar
EXPOSE 8082
#ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "notification-service.jar"]
