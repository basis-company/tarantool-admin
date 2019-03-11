mkdir ./admin

wget https://use.fontawesome.com/releases/v5.0.6/fontawesome-free-5.0.6.zip
unzip ./fontawesome-free-5.0.6.zip
mv fontawesome-free-5.0.6/on-server ./admin/fontawesome-free-5.0.6
rm -rf ./fontawesome-free-5.0.6*

wget http://cdn.sencha.com/ext/gpl/ext-6.2.0-gpl.zip
unzip ./ext-6.2.0-gpl.zip
mkdir ./admin/ext-6.2.0
mv ext-6.2.0/build/ext-all.js ./admin/ext-6.2.0/ext-all.js
mkdir ./admin/ext-6.2.0/classic
mv ext-6.2.0/build/classic/theme-crisp ./admin/ext-6.2.0/classic/theme-crisp
rm -rf ./ext-6.2.0*