#FROM eclipse-temurin:21-jdk
#WORKDIR /app
#COPY target/tribetalk-0.0.1-SNAPSHOT.jar tribetalk.jar
#EXPOSE 8080
##ENV SPRING_PROFILES_ACTIVE=prod
#ENTRYPOINT ["java", "-jar", "tribetalk.jar"]

#Multi-stage build for Spring-Boot Application
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

#Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

#Copy Source code and build
COPY src ./src
RUN mvn clean package -DskipTests

#Production Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

#Create non-root user
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S appuser -G appuser

#Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

#Change Ownership
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

#RUN apk add --no-cache wget

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"]


