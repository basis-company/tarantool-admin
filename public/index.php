<?php

$version = null;
$filename = dirname(__DIR__) . '/var/version.php';

if (file_exists($filename)) {
    $version = include $filename;
    $version = $version['tag'] ?: $version['short_sha'];
}
?>
<!DOCTYPE html>
<html>
    <head>
        <title>tarantool admin <?php echo $version; ?></title>
        <meta content="text/html;charset=utf-8" http-equiv="Content-Type">
        <meta content="utf-8" http-equiv="encoding">
        <link rel="stylesheet" href="/admin/ext-6.2.0/classic/theme-crisp/resources/theme-crisp-all.css" />
        <link rel="stylesheet" href="/admin/fontawesome-free-5.0.6/css/fontawesome-all.css" />
        <link rel="stylesheet" href="/admin/style.css<?php echo '?', $version; ?>" />
        <link rel="icon" type="image/png" sizes="48x48" href="/admin/39156475-8b873e18-4756-11e8-89d0-6ffca592f664.png">

    </head>
    <body>
        <!-- Ace Editor (vendored locally) -->
        <script src="/admin/vendor/ace/ace.js"></script>
        <script src="/admin/vendor/ace/mode-sql.js"></script>
        <script src="/admin/vendor/ace/theme-textmate.js"></script>

        <script src="/admin/ext-6.2.0/ext-all.js"></script>
        <script src="/admin/js/bootstrap.js"></script>
    </body>
</html>
