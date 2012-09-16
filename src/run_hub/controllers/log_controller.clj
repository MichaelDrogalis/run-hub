(ns run-hub.controllers.log-controller
  (:require [run-hub.views.log :as views]
            [run-hub.models.log :as log]
            [run-hub.persistence :as persistence]))

(defn mikes-log []
  (let [weeks-of-training (log/group-by-week (persistence/mikes-log))]
    (views/mikes-log weeks-of-training)))

(defn mikes-mpw []
  (views/mikes-mpw))

(defn mikes-log-for-week [when]
  (let [all-training (persistence/mikes-log)
        start-of-week (log/previous-sunday (log/parse-dashed-date when))
        relevant-training (log/group-by-week (log/workouts-for-week all-training start-of-week))]
    (views/mikes-log relevant-training)))

