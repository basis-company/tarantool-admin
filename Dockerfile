FROM php:7.1.3-apache

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --force-yes zlib1g-dev git \
&& docker-php-ext-install zip \
&& docker-php-ext-install opcache \
&& curl -sS https://getcomposer.org/installer | php \
&& a2enmod rewrite

ADD composer.json /var/www/html
RUN php composer.phar install --no-dev

ADD public /var/www/html
ADD src /var/www/html/src
RUN php composer.phar dump-autoload -o

RUN rm composer.*
