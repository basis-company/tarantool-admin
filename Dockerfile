# Build
FROM php:cli as build
WORKDIR /app
RUN apt-get update && apt-get install -y git wget zip
RUN wget https://use.fontawesome.com/releases/v5.0.6/fontawesome-free-5.0.6.zip \
    && wget http://cdn.sencha.com/ext/gpl/ext-6.2.0-gpl.zip \
    && unzip ./fontawesome-free-5.0.6.zip \
    && unzip ./ext-6.2.0-gpl.zip

ADD .git /app/.git
RUN export CI_COMMIT_TAG=$(git describe --tags) \
    && export CI_COMMIT_REF_NAME=$(git rev-parse --abbrev-ref HEAD) \
    && export CI_COMMIT_SHA=$(git rev-parse --verify HEAD) \
    && export CI_COMMIT_SHORT_SHA=$(git rev-parse --verify HEAD | head -c 8) \
    && echo "<?php return ['tag'=>'$CI_COMMIT_TAG','sha'=>'$CI_COMMIT_SHA','short_sha'=>'$CI_COMMIT_SHORT_SHA','ref_name'=>'$CI_COMMIT_REF_NAME'];" > version.php

# Runtime
FROM quay.io/basis-company/skeleton

WORKDIR /app

RUN apt-get update && apt-get install -y libmpdec-dev \
    && pecl install decimal \
    && docker-php-ext-enable decimal

COPY --from=build /app/fontawesome-free-5.0.6/on-server ./admin/fontawesome-free-5.0.6
COPY --from=build /app/ext-6.2.0/build/ext-all.js ./admin/ext-6.2.0/ext-all.js
COPY --from=build /app/ext-6.2.0/build/classic/theme-crisp ./admin/ext-6.2.0/classic/theme-crisp
COPY --from=build /app/version.php .

ADD composer.json /app
ADD public /app
ADD php /app/php

RUN mkdir admin/downloads -p
