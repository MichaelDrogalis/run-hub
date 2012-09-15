(ns run-hub.handler
  (:require [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [ring.adapter.jetty :refer :all]
            [run-hub.controllers.log-controller :as log-controller]))

(defroutes app-routes
  (GET "/MikeDrogalis/log" [] (log-controller/mikes-log))
  (GET "/MikeDrogalis/mpw" [] (log-controller/mikes-mpw))
  (route/resources "/")
  (route/not-found "Not Found"))

(def app (handler/site #'app-routes))
(def app-var #'app)

(defn -main []
  (let [port (Integer/parseInt (System/getenv "PORT"))]
    (run-jetty app {:port port})))

