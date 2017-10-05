FROM php:apache

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --force-yes zlib1g-dev git \
&& docker-php-ext-install zip \
&& docker-php-ext-install opcache \
&& curl -sS https://getcomposer.org/installer | php \
&& a2enmod rewrite

RUN echo "ServerName tarantool-admin" > /etc/apache2/conf-enabled/server-name.conf

ADD composer.json /var/www/html
RUN php composer.phar install --no-dev

ADD public /var/www/html
ADD php /var/www/html/php
RUN mkdir admin/downloads &&  chown www-data admin/downloads && chgrp www-data admin/downloads
RUN php composer.phar dump-autoload -o
RUN cp vendor/basis-company/framework/resources/default/.htaccess .
RUN cp vendor/basis-company/framework/resources/default/server.php .
