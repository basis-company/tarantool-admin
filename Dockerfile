# Build

FROM php:apache AS build

WORKDIR /build

RUN curl -sSLf \
        -o /usr/local/bin/install-php-extensions \
        https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions && \
    chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions gd xdebug

RUN apt-get update && apt-get install -y git wget zip libmpdec-dev
RUN install-php-extensions decimal

RUN wget -q https://use.fontawesome.com/releases/v5.0.6/fontawesome-free-5.0.6.zip \
    && wget -q http://cdn.sencha.com/ext/gpl/ext-6.2.0-gpl.zip \
    && unzip -q ./fontawesome-free-5.0.6.zip \
    && unzip -q ./ext-6.2.0-gpl.zip

RUN git clone --branch v1.5.0 --depth 1 https://github.com/ajaxorg/ace-builds.git

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
FROM php:apache

WORKDIR /var/www/html

RUN curl -sSLf \
        -o /usr/local/bin/install-php-extensions \
        https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions && \
    chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions gd xdebug

RUN install-php-extensions decimal

RUN apt-get update && apt-get install -y zip zlib1g-dev libzip-dev uuid-dev libmpdec-dev \
&& docker-php-ext-install zip \
&& pecl install uuid \
&& docker-php-ext-enable uuid \
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
COPY --from=build /build/ace-builds/src-min-noconflict/ace.js public/admin/ace/ace.js
COPY --from=build /build/ace-builds/src-min-noconflict/mode-sql.js public/admin/ace/mode-sql.js
COPY --from=build /build/ace-builds/src-min-noconflict/theme-textmate.js public/admin/ace/theme-textmate.js
COPY --from=build /build/vendor vendor/
COPY --from=build /build/version.php var/
