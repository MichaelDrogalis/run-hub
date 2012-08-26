(ns run-hub.handler
  (:require [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [run-hub.views.log :as log-views]))

(defroutes app-routes
  (GET "/MikeDrogalis/log" [] (log-views/mikes-log))
  (route/resources "/")
  (route/not-found "Not Found"))

(def app
  (handler/site app-routes))
