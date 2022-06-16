FROM ubuntu:22.04

USER root
COPY . /carrefour
WORKDIR /carrefour

RUN apt update && apt install -y libgdal-dev python3-pip
RUN pip3 install -r requirements.txt

ENTRYPOINT python3 main.py