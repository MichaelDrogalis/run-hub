(ns run-hub.test.acceptance-test
  (:require [midje.sweet :refer :all]
            [clj-webdriver.taxi :refer :all]))

(set-driver! {:browser :firefox})

(defn local [path]
  (str "http://localhost:3000" path))

(fact "It finds the page of my log"
      (to (local "/MikeDrogalis/log"))
      (text "#runner-info")
      => "Log of Mike Drogalis")

(fact "It has the first date of my training as January 1, 2012"
      (to (local "/MikeDrogalis/log"))
      (.contains (text "#training-log") "January 1, 2012")
      => true)

(quit)

