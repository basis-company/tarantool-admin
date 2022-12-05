<?php

namespace Job\Export;

use Job\Space\Select;
use RuntimeException;

class Csv extends Select
{
    public int $limit = 1000;
    public string $delimiter = ";";
    public int $keepFiles = 60; // 60 seconds

    public function run(): array
    {
        $name = md5(json_encode([
            $this->space,
            $this->index,
            $this->key,
            microtime(1),
        ]));

        $data = [];
        $page = 0;
        $this->offset = 0;

        while (!$page || count($data) < $total) {
            $result = parent::run();
            foreach ($result['data'] as $item) {
                foreach ($item as $k => $v) {
                    if (is_array($v)) {
                        $item[$k] = json_encode($v);
                    }
                }
                $data[] = nl2br(implode($this->delimiter, $item));
            }

            $total = $result['total'];

            $page++;
            $this->offset = $page * $this->limit;
        }

        $fields = $this->getSpace()->getFields();

        $contents = implode($this->delimiter, $fields) . PHP_EOL . implode(PHP_EOL, $data);

        $folder = 'admin/downloads';

        if (!is_dir($folder)) {
            if (!mkdir($folder) && !is_dir($folder)) {
                throw new RuntimeException(sprintf('Directory "%s" was not created', $folder));
            }
        } else {
            foreach (scandir($folder) as $file) {
                if ($file === '.' || $file === '..') {
                    continue;
                }
                $path = $folder . '/' . $file;
                if (filemtime($path) < time() - $this->keepFiles) {
                    unlink($path);
                }
            }
        }

        $path = $folder . '/' . $name . '.csv';
        file_put_contents($path, $contents);

        return compact('path');
    }
}
