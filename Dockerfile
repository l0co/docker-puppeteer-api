FROM l0coful/debian-base

ENV IMAGE_NAME puppeteer-api
ENV IMAGE_VERSION 1.0
ENV SALT="NO-SALT"
LABEL docker.image.name=$IMAGE_NAME
LABEL image.version=$IMAGE_VERSION
STOPSIGNAL SIGTERM

# install nodejs
RUN apt-get update
RUN apt-get install -y gnupg2 git
RUN wget -qO- https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

# install chrome
WORKDIR /root
RUN wget -mS -O google-chrome-stable_current_amd64.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN bash -c "dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install; dpkg -i google-chrome-stable_current_amd64.deb;"
RUN rm google-chrome-stable_current_amd64.deb
COPY resources/root /root
WORKDIR /root/puppeteer-api
RUN npm i

COPY resources/bootstrap-start.sh /
RUN chmod 0755 /bootstrap-start.sh
COPY resources/bootstrap-stop.sh /
RUN chmod 0755 /bootstrap-stop.sh
COPY resources/usr/local/bin/puppeteer /usr/local/bin
RUN chmod 0755 /usr/local/bin/puppeteer

EXPOSE 9222 8000
