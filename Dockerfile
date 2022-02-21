# Build
FROM php:8.0-apache AS build

WORKDIR /build

RUN apt-get update && apt-get install -y git wget zip libmpdec-dev \
    && pecl install decimal \
    && docker-php-ext-enable decimal

RUN wget -q https://use.fontawesome.com/releases/v5.0.6/fontawesome-free-5.0.6.zip \
    && wget -q http://cdn.sencha.com/ext/gpl/ext-6.2.0-gpl.zip \
    && unzip -q ./fontawesome-free-5.0.6.zip \
    && unzip -q ./ext-6.2.0-gpl.zip

COPY .git .git/
RUN CI_COMMIT_TAG=$(git describe --tags) \
    CI_COMMIT_REF_NAME=$(git rev-parse --abbrev-ref HEAD) \
    CI_COMMIT_SHA=$(git rev-parse --verify HEAD) \
    CI_COMMIT_SHORT_SHA=$(git rev-parse --verify HEAD | head -c 8) \
    && echo "<?php return ['tag' => '$CI_COMMIT_TAG', 'sha' => '$CI_COMMIT_SHA', 'short_sha' => '$CI_COMMIT_SHORT_SHA','ref_name'=>'$CI_COMMIT_REF_NAME'];" > version.php

COPY php php/
COPY composer.json composer.lock ./

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --prefer-dist --no-dev --no-autoloader --no-scripts --no-progress \
    && composer dump-autoload --classmap-authoritative --no-dev \
    && composer clear-cache


# Runtime
FROM php:8.0-apache

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y zip zlib1g-dev libzip-dev libmpdec-dev uuid-dev \
    && docker-php-ext-install zip opcache \
    && pecl install decimal uuid \
    && docker-php-ext-enable decimal uuid \
    && a2enmod rewrite

RUN echo "ServerName tarantool-admin" > /etc/apache2/conf-enabled/server-name.conf
RUN sed -i 's~DocumentRoot.*$~DocumentRoot /var/www/html/public~' /etc/apache2/sites-available/000-default.conf

RUN mkdir -p public/admin/downloads \
    && chown www-data public/admin/downloads \
    && chgrp www-data public/admin/downloads

RUN mkdir var \
    && chown www-data var \
    && chgrp www-data var

COPY php php/
COPY public public/

COPY --from=build /build/fontawesome-free-5.0.6/on-server public/admin/fontawesome-free-5.0.6
COPY --from=build /build/ext-6.2.0/build/ext-all.js public/admin/ext-6.2.0/ext-all.js
COPY --from=build /build/ext-6.2.0/build/classic/theme-crisp public/admin/ext-6.2.0/classic/theme-crisp
COPY --from=build /build/vendor vendor/
COPY --from=build /build/version.php var/
