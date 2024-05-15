<?php

namespace Job\Entity;

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
        $row = $space->findOne($params);
        $space->delete($row);
    }
}
