# Build
FROM php:apache as build
WORKDIR /var/www/html
RUN apt-get update && apt-get install -y git wget zip
RUN wget -q https://use.fontawesome.com/releases/v5.0.6/fontawesome-free-5.0.6.zip \
    && wget -q http://cdn.sencha.com/ext/gpl/ext-6.2.0-gpl.zip \
    && unzip -q ./fontawesome-free-5.0.6.zip \
    && unzip -q ./ext-6.2.0-gpl.zip

ADD .git /var/www/html/.git
RUN export CI_COMMIT_TAG=$(git describe --tags) \
    && export CI_COMMIT_REF_NAME=$(git rev-parse --abbrev-ref HEAD) \
    && export CI_COMMIT_SHA=$(git rev-parse --verify HEAD) \
    && export CI_COMMIT_SHORT_SHA=$(git rev-parse --verify HEAD | head -c 8) \
    && echo "<?php return ['tag'=>'$CI_COMMIT_TAG','sha'=>'$CI_COMMIT_SHA','short_sha'=>'$CI_COMMIT_SHORT_SHA','ref_name'=>'$CI_COMMIT_REF_NAME'];" > version.php

# Runtime
FROM php:apache

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y zip zlib1g-dev libzip-dev libmpdec-dev \
    && docker-php-ext-install zip \
    && docker-php-ext-install opcache \
    && pecl install decimal \
    && docker-php-ext-enable decimal \
    && curl -sS https://getcomposer.org/installer | php \
    && a2enmod rewrite

RUN echo "ServerName tarantool-admin" > /etc/apache2/conf-enabled/server-name.conf

COPY --from=build /var/www/html/fontawesome-free-5.0.6/on-server ./admin/fontawesome-free-5.0.6
COPY --from=build /var/www/html/ext-6.2.0/build/ext-all.js ./admin/ext-6.2.0/ext-all.js
COPY --from=build /var/www/html/ext-6.2.0/build/classic/theme-crisp ./admin/ext-6.2.0/classic/theme-crisp

ADD composer.json /var/www/html
RUN php composer.phar install --no-dev

COPY --from=build /var/www/html/version.php .

ADD . /var/www/html/php

RUN mkdir admin/downloads -p \
    && chown www-data admin/downloads \
    && chgrp www-data admin/downloads \
    && php composer.phar dump-autoload -o