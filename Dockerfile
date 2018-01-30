FROM php:apache

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y git wget zip zlib1g-dev \
&& docker-php-ext-install zip \
&& docker-php-ext-install opcache \
&& curl -sS https://getcomposer.org/installer | php \
&& a2enmod rewrite

RUN echo "ServerName tarantool-admin" > /etc/apache2/conf-enabled/server-name.conf

ADD installer.sh /var/www/html
RUN chmod +x installer.sh && ./installer.sh

ADD composer.json /var/www/html
RUN php composer.phar install --no-dev

ADD public /var/www/html
ADD php /var/www/html/php
RUN mkdir admin/downloads -p && chown www-data admin/downloads && chgrp www-data admin/downloads
RUN php composer.phar dump-autoload -o
RUN cp vendor/basis-company/framework/resources/default/.htaccess . \
&& cp vendor/basis-company/framework/resources/default/server.php . \
&& cd /var/www/html/admin \
&& ln -s ../client-libraries/ext-6.2.0 ext-6.2.0 \
&& ln -s ../client-libraries/fontawesome-free-5.0.6 fontawesome-free-5.0.6
