<?php

namespace Job\Row;

use Job\Space\Job;
use Exception;
use stdClass;

class Remove extends Job
{
    public stdClass $id;

    public function run(): void
    {
        $space = $this->getSpace();
        $params = get_object_vars($this->id);
        if (!count($params)) {
            throw new Exception("Invalid params");
        }
        $space->delete($space->findOrFail($params));
    }
}
