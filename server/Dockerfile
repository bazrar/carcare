FROM            node:16.15.0-alpine
LABEL           author="Udeep Shrestha"

ARG             buildVersion

# ENV             NODE_ENV=development
# ENV             PORT=3000
# ENV build=buildVersion

WORKDIR         /app
RUN             apk update && yarn global add @nestjs/cli
COPY            package.json .
RUN             yarn 
COPY            . .
EXPOSE          ${PORT}

# RUN             echo "build verison: ${build}}"

ENTRYPOINT      ["yarn", "start:dev"]