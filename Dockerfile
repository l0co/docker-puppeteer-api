FROM alpine:3.19.1

ENV IMAGE_NAME=puppeteer-api
ENV IMAGE_VERSION=2.0
LABEL docker.image.name=$IMAGE_NAME
LABEL image.version=$IMAGE_VERSION
STOPSIGNAL SIGTERM

# install dependencies
RUN \
  set -x \
  && apk update \
  && apk add \
      bash \
      nodejs \
      npm \
      chromium

COPY resources/root /root
WORKDIR /root/puppeteer-api
RUN npm install

COPY resources/bootstrap.sh /
RUN chmod 0755 /bootstrap.sh
COPY resources/bootstrap-start.sh /
RUN chmod 0755 /bootstrap-start.sh
COPY resources/bootstrap-stop.sh /
RUN chmod 0755 /bootstrap-stop.sh
COPY resources/healthcheck.sh /
RUN chmod 0755 /healthcheck.sh
COPY resources/usr/local/bin/puppeteer /usr/local/bin
RUN chmod 0755 /usr/local/bin/puppeteer

ENTRYPOINT ["/bootstrap.sh"]
HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD [ "/healthcheck.sh" ]

EXPOSE 9222 8000
