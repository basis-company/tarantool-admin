<?php

namespace Job\Export;

use Exception;
use Job\Space\Select;
use Basis\Filesystem;

class Csv extends Select
{
    public $limit = 1000;

    private $fs;
    public $delimiter = ";";

    // 60 seconds
    public $keepFiles = 60;

    public function __construct(Filesystem $fs)
    {
        $this->fs = $fs;
    }

    public function run()
    {
        $name = md5(json_encode([
            $this->space,
            $this->index,
            $this->key,
            microtime(1),
        ]));

        $page = 0;
        $this->offset = 0;

        while (!$page || count($data) < $total) {

            $result = parent::run();

            foreach($result['data'] as $item) {
                $data[] = implode($this->delimiter, $item);
            }

            $total = $result['total'];

            $page++;
            $this->offset = $page * $this->limit;
        }

        $fields = [];
        foreach ($this->getSpace()->getFormat() as $field) {
            $fields[] = $field['name'];
        }

        $contents = implode($this->delimiter, $fields).PHP_EOL.implode(PHP_EOL, $data);

        $folder = 'admin/downloads';
        $fs = $this->fs;

        $dir = $fs->getPath($folder);
        if (!is_dir($dir)) {
            mkdir($dir);

        } else {
            foreach ($fs->listFiles($folder) as $file) {
                $path = $fs->getPath($folder.'/'.$file);
                if (filemtime($path) < time() - $this->keepFiles) {
                    unlink($path);
                }
            }
        }

        $path = $folder.'/'.$name.'.csv';
        file_put_contents($fs->getPath($path), $contents);

        return compact('path');
    }
}
