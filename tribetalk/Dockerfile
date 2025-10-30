FROM openjdk:21-jdk
WORKDIR /app
COPY target/tribetalk.jar app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "app.jar"]