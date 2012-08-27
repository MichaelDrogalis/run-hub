(ns run-hub.handler
  (:require [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [run-hub.controllers.log-controller :as log-controller]))

(defroutes app-routes
  (GET "/MikeDrogalis/log" [] (log-controller/mikes-log))
  (route/resources "/")
  (route/not-found "Not Found"))

(def app
  (handler/site app-routes))
