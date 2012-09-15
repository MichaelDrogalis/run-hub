(ns run-hub.controllers.log-controller
  (:require [run-hub.views.log :as views]
            [run-hub.models.log :as log]
            [run-hub.persistence :as persistence]))

(defn mikes-log []
  (let [weeks-of-training (log/group-by-week (persistence/mikes-log))]
    (views/mikes-log weeks-of-training)))

(defn mikes-mpw []
  (views/mikes-mpw))

