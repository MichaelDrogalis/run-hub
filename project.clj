(defproject run-hub "0.1.0-SNAPSHOT"
  :description "Social training for distance runners"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [compojure "1.1.1"]
                 [ring "1.1.3"]            
                 [clj-webdriver "0.6.0-alpha11"]
                 [hiccup "1.0.1"]
                 [midje "1.4.0"]
                 [clj-time "0.4.3"]
                 [com.stuartsierra/lazytest "1.2.3"]]                 
  :plugins [[lein-ring "0.7.3"]]
  :ring {:handler run-hub.handler/app-var}
  :repositories {"stuart" "http://stuartsierra.com/maven2"}  
  :profiles
  {:dev {:plugins [[ring-mock "0.1.3"]
                   [lein-swank "1.4.4"]
                   [lein-midje "2.0.0-SNAPSHOT"]]}})

