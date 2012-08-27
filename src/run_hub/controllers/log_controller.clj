(ns run-hub.controllers.log-controller
  (:require [run-hub.views.log :as views]
            [run-hub.persistence :as persistence]))

(defn mikes-log []
  (views/mikes-log (persistence/mikes-log)))

