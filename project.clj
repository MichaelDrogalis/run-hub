(defproject run-hub "0.1.0-SNAPSHOT"
  :description "Social training for distance runners"
  :ring {:handler run-hub.handler/app-var}
  :min-lein-version "2.0.0"
  :repositories {"stuart" "http://stuartsierra.com/maven2"}  
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [compojure "1.1.1"]
                 [ring "1.1.3"]            
                 [clj-webdriver "0.6.0-alpha11"]
                 [hiccup "1.0.1"]
                 [midje "1.4.0"]
                 [clj-time "0.4.3"]
                 [com.stuartsierra/lazytest "1.2.3"]
                 [zombie "0.1.1-SNAPSHOT"]
                 [cheshire "4.0.2"]]
  :cljsbuild {:builds [{:source-path "resources/public/cljs"
                        :compiler {:output-to "resources/public/js/cljs-compiled.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}]}
  :profiles
  {:dev {:plugins [[lein-ring "0.7.3"]
                   [ring-mock "0.1.3"]
                   [lein-swank "1.4.4"]
                   [lein-midje "2.0.0-SNAPSHOT"]
                   [lein-cljsbuild "0.2.7"]]}}
  :main run-hub.handler)

