<?php

namespace Jobs\Entity;

use Jobs\Space\Job;

class Remove extends Job
{
    public $id;

    public function run()
    {
        $pk = [];
        $space = $this->getSpace();

        foreach($space->getPrimaryIndex()->parts as $part) {
            $pk[] = $this->id->{$space->getFormat()[$part[0]]['name']};
        }

        $entity = $space->getRepository()->findOne($pk);
        $this->getMapper()->remove($entity);
    }
}