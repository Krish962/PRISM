FROM rocker/r-ver:4.5.2

ENV DEBIAN_FRONTEND=noninteractive \
    DSSAT_ROOT=/opt/dssat \
    DSSAT_EXECUTABLE=/opt/dssat/dscsm048

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake \
    gfortran \
    make \
    curl \
    gnupg \
    default-jdk \
    libcurl4-openssl-dev \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libssl-dev \
    libudunits2-dev \
    libxml2-dev \
    libfontconfig1-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY src/simulation/dssat-csm-os /tmp/dssat-csm-os

RUN cmake -S /tmp/dssat-csm-os -B /tmp/dssat-csm-os/build \
      -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_INSTALL_PREFIX=/opt/dssat \
    && cmake --build /tmp/dssat-csm-os/build --target install -- -j2 \
    && test -x /opt/dssat/dscsm048 \
    && rm -rf /tmp/dssat-csm-os

RUN Rscript -e "install.packages(c('jsonlite', 'dplyr', 'lubridate', 'DSSAT'), repos='https://cloud.r-project.org')" \
    && Rscript -e "stopifnot(all(vapply(c('jsonlite', 'dplyr', 'lubridate', 'DSSAT'), requireNamespace, logical(1), quietly=TRUE)))"

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

EXPOSE 5000
CMD ["npm", "start"]