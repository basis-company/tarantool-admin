# Build
FROM php:apache as build
WORKDIR /var/www/html
RUN apt-get update && apt-get install -y git
ADD .git /var/www/html/.git
RUN export CI_COMMIT_TAG=$(git describe --tags) \
    && export CI_COMMIT_REF_NAME=$(git rev-parse --abbrev-ref HEAD) \
    && export CI_COMMIT_SHA=$(git rev-parse --verify HEAD) \
    && export CI_COMMIT_SHORT_SHA=$(git rev-parse --verify HEAD | head -c 8) \
    && echo "<?php return ['tag'=>'$CI_COMMIT_TAG','sha'=>'$CI_COMMIT_SHA','short_sha'=>'$CI_COMMIT_SHORT_SHA','ref_name'=>'$CI_COMMIT_REF_NAME'];" > version.php

# Runtime
FROM php:apache as runtime
WORKDIR /var/www/html

RUN apt-get update && apt-get install -y git wget zip zlib1g-dev libzip-dev libmpdec-dev \
&& docker-php-ext-install zip \
&& docker-php-ext-install opcache \
&& pecl install decimal \
&& docker-php-ext-enable decimal \
&& curl -sS https://getcomposer.org/installer | php \
&& a2enmod rewrite

RUN echo "ServerName tarantool-admin" > /etc/apache2/conf-enabled/server-name.conf

ADD installer.sh /var/www/html
RUN chmod +x installer.sh && ./installer.sh

ADD composer.json /var/www/html
RUN php composer.phar install --no-dev
COPY --from=build /var/www/html/version.php .
ADD public /var/www/html
ADD php /var/www/html/php
RUN mkdir admin/downloads -p && chown www-data admin/downloads && chgrp www-data admin/downloads
RUN php composer.phar dump-autoload -o
RUN cp vendor/basis-company/framework/resources/default/.htaccess . \
&& cp vendor/basis-company/framework/resources/default/server.php . \
&& cd /var/www/html/admin