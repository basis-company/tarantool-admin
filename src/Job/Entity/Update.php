<?php

namespace Job\Entity;

use Job\Space\Job;

class Update extends Job
{
    public $values;

    public function run()
    {
        $pk = [];
        $space = $this->getSpace();

        foreach ($space->getPrimaryIndex()['parts'] as $part) {
            $pk[] = $this->values->{$space->getFormat()[$part[0]]['name']};
        }

        $entity = $space->getRepository()->findOne($pk);
        foreach ($this->values as $k => $v) {
            $entity->$k = $v;
        }
        $this->getMapper()->save($entity);
    }
}
