FROM        node:16.15.0-alpine
LABEL       author="Udeep Shrestha"

ENV         NODE_ENV=development
ENV         TWILIO_ACCOUNT_SID=ACa6213af064b**************
ENV         TWILIO_ACCOUNT_SID=b5e1f89ed92c7c5****************

WORKDIR     /app
RUN         apk update && yarn global add @nestjs/cli
COPY        package.json yarn.lock ./   
RUN         yarn
COPY        . .

ENTRYPOINT  [ "yarn", "start:dev" ]