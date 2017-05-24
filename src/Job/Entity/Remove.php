<?php

namespace Job\Entity;

use Job\Space\Job;

class Remove extends Job
{
    public $id;

    public function run()
    {
        $entity = $this->getSpace()->getRepository()
            ->findOne(get_object_vars($this->id));

        $this->getMapper()->remove($entity);
    }
}
