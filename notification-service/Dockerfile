FROM openjdk:21-jdk
WORKDIR /app
COPY target/notification-service-0.0.1-SNAPSHOT.jar notification-service.jar
EXPOSE 8082
#ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "notification-service.jar"]