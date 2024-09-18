# syntax=docker/dockerfile:1

ARG ARM=''
ARG SYSROOT='/emsdk/upstream/emscripten/cache/sysroot'

FROM docker.io/emscripten/emsdk:3.1.67${ARM} as base

SHELL ["/bin/bash", "-euxc"]

RUN apt-get update -y && apt-get install -y pkg-config

# Change emscripten default compilation configs
COPY settings.sh /settings.sh
RUN /settings.sh

ENV FFLAGS="-fasynchronous-unwind-tables -fexceptions"
ENV CFLAGS="-r -Oz -flto -fwasm-exceptions --minify=0 --closure=0 --no-entry -pipe -Wall -Werror=format-security ${FFLAGS}"
ENV LDFLAGS="-pipe ${FFLAGS}"
ENV CXXFLAGS="$CFLAGS -fno-rtti -fno-exceptions"

WORKDIR /src

# --

FROM base as mbedtls

# Download & de-compress
RUN curl -fsSL https://github.com/Mbed-TLS/mbedtls/archive/refs/tags/v3.6.1.tar.gz \
	| tar -xzf- -C /src --strip-components 1

RUN curl -fsSL https://github.com/Mbed-TLS/mbedtls-framework/archive/94599c0e3b5036e086446a51a3f79640f70f22f6.tar.gz \
	| tar -xzf- -C /src/framework --strip-components 1

# Fix bug with newer compilers due to missing \emptydescription
RUN find . -type f \( -name '*.c' -o -name '*.h' \) -exec \
	sed -i -e 's/\(\\retval\s\{1,\}#[A-Z_]\{1,\}\)$/\1 \\emptydescription/g' {} +

# Compile & install
WORKDIR /src/build
RUN emcmake cmake \
	-DCMAKE_BUILD_TYPE=MinSizeRel \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DENABLE_TESTING=Off \
	-DENABLE_PROGRAMS=Off \
	.. || { cat /src/build/CMakeFiles/CMakeError.log; exit 1; }
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as lz4

# Download & de-compress
RUN curl -fsSL https://github.com/lz4/lz4/archive/refs/tags/v1.10.0.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Compile & install
WORKDIR /src/build/cmake/build
RUN emcmake cmake \
	-DCMAKE_BUILD_TYPE=MinSizeRel \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DLZ4_BUILD_CLI=Off \
	-DLZ4_BUILD_LEGACY_LZ4C=Off \
	.. || { cat /src/build/CMakeFiles/CMakeError.log; exit 1; }
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as lzo

# Download & de-compress
RUN curl -fsSL https://www.oberhumer.com/opensource/lzo/download/lzo-2.10.tar.gz \
	| tar -xzf- -C /src --strip-components 1

RUN sed -i "/^if(0)/d" /src/CMakeLists.txt \
	&& sed -i "/^add_test/d" /src/CMakeLists.txt \
	&& sed -i "/^include(CTest)/d" /src/CMakeLists.txt \
	&& sed -ie 's/^if(1)/if(0)/' /src/CMakeLists.txt \
	&& sed -ie 's/^# main test driver/if(0)/' /src/CMakeLists.txt

# Compile & install
WORKDIR /src/build
RUN emcmake cmake \
	-DCMAKE_BUILD_TYPE=MinSizeRel \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	.. || { cat /src/build/CMakeFiles/CMakeError.log; exit 1; }
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as lzma

# Download & de-compress
RUN curl -fsSL https://github.com/tukaani-project/xz/releases/download/v5.6.2/xz-5.6.2.tar.xz \
	| tar -xJf- -C /src --strip-components 1

# Compile & install
WORKDIR /src/build
# Note: DENABLE_THREADS=OFF must be uppercase
RUN emcmake cmake \
	-DCMAKE_BUILD_TYPE=MinSizeRel \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_SKIP_INSTALL_ALL_DEPENDENCY=On \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DCMAKE_C_BYTE_ORDER=LITTLE_ENDIAN \
	-DCMAKE_CXX_BYTE_ORDER=LITTLE_ENDIAN \
	-DHAVE_POSIX_SPAWN=0 -DHAVE_PTHREAD_H=0 -DHAVE_LIBPTHREAD=0 -DPTHREAD_IN_LIBC=0 -DHAVE_POSIX_SPAWNP=0 \
	-DWORDS_BIGENDIAN=0 \
	-DENABLE_THREADS=OFF \
	-DENABLE_SMALL=On \
	-DBUILD_TESTING=Off \
	-DCREATE_XZ_SYMLINKS=Off \
	-DCREATE_LZMA_SYMLINKS=Off \
	.. || { cat /src/build/CMakeFiles/CMakeError.log; exit 1; }
# Only build liblzma, because the xz utilities are not compatible with WebASM yet
RUN emmake make -j$(nproc) liblzma
# Work-around make install requiring this files to exist to not fail
RUN touch xz.js xzdec.js lzmadec.js lzmainfo.js
RUN emmake make install

# --

FROM base as zstd

# Download & de-compress
RUN curl -fsSL https://github.com/facebook/zstd/releases/download/v1.5.6/zstd-1.5.6.tar.gz \
	| tar -xzf- -C /src --strip-components 1

# Compile & install
WORKDIR /src/build/cmake/build
RUN emcmake cmake \
	-DCMAKE_BUILD_TYPE=MinSizeRel \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DZSTD_BUILD_TESTS=Off \
	-DZSTD_BUILD_STATIC=On \
	-DZSTD_BUILD_SHARED=Off \
	-DZSTD_BUILD_CONTRIB=Off \
	-DZSTD_BUILD_PROGRAMS=Off \
	-DZSTD_MULTITHREAD_SUPPORT=Off \
	.. || { cat /src/build/CMakeFiles/CMakeError.log; exit 1; }
RUN emmake make -j$(nproc)
RUN emmake make install

# --

FROM base as libarchive

ARG SYSROOT

# Download & de-compress
RUN curl -fsSL https://github.com/libarchive/libarchive/releases/download/v3.7.5/libarchive-3.7.5.tar.xz \
	| tar -xJf- -C /src --strip-components 1

# Patch to disable grzip and lrzip
COPY ./remove_support_for_external_programs.patch ./
RUN patch -p1 -i remove_support_for_external_programs.patch

# Build internal emsdk zlib version
RUN embuilder --lto --pic build zlib

# Build internal emsdk bzip2 version
RUN embuilder --lto --pic build bzip2

# Copy compiled dependencies
COPY --from=mbedtls $SYSROOT $SYSROOT
COPY --from=lz4 $SYSROOT $SYSROOT
COPY --from=lzo $SYSROOT $SYSROOT
COPY --from=lzma $SYSROOT $SYSROOT
COPY --from=zstd $SYSROOT $SYSROOT

# Compile & install
WORKDIR /src/_build
ENV CFLAGS="$CFLAGS -DARCHIVE_ERRNO_PROGRAMMER_ERROR=-3 -DARCHIVE_ERRNO_FILE_FORMAT=-2 -DARCHIVE_ERRNO_MISC=-1"
RUN emcmake cmake \
	-DCMAKE_BUILD_TYPE=MinSizeRel \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DHAVE_POSIX_SPAWN=0 -DHAVE_PTHREAD_H=0 -DHAVE_LIBPTHREAD=0 -DPTHREAD_IN_LIBC=0 -DHAVE_POSIX_SPAWNP=0 \
	-DHAVE_VFORK=0 -DHAVE_FORK=0 -DHAVE__FSEEKI64=0 \
	-DHAVE_WCSCPY=1 -DHAVE_WCSLEN=1 \
	-DENABLE_MBEDTLS=On \
	-DENABLE_NETTLE=Off \
	-DENABLE_OPENSSL=Off \
	-DENABLE_LIBB2=Off \
	-DENABLE_LZ4=On \
	-DENABLE_LZO=On \
	-DENABLE_LZMA=On \
	-DENABLE_ZSTD=On \
	-DENABLE_ZLIB=On \
	-DZLIB_LIBRARY=${SYSROOT}/lib/wasm64-emscripten/lto-pic/libz.a \
	-DENABLE_BZip2=On \
	-DBZIP2_LIBRARIES=${SYSROOT}/lib/wasm64-emscripten/lto-pic/libbz2.a \
	-DENABLE_LIBXML2=Off \
	-DENABLE_EXPAT=Off \
	-DENABLE_PCREPOSIX=Off \
	-DENABLE_LIBGCC=Off \
	-DENABLE_CNG=Off \
	-DENABLE_TAR=Off \
	-DENABLE_CPIO=Off \
	-DENABLE_CAT=Off \
	-DENABLE_UNZIP=Off \
	-DENABLE_XATTR=Off \
	-DENABLE_ACL=Off \
	-DENABLE_ICONV=Off \
	-DENABLE_TEST=Off \
	-DPOSIX_REGEX_LIB=libc \
	-DLIBARCHIVE_STATIC=1 \
	.. || { cat /src/build/CMakeFiles/CMakeError.log; exit 1; }
RUN emmake make -j$(nproc) 2>&1
RUN emmake make install

# --

FROM base as wrapper

ARG SYSROOT

# Copy wrapper source and config
COPY ./wrapper.c ./
COPY ./lib.exports ./

# Copy compiled dependencies
COPY --from=libarchive $SYSROOT $SYSROOT

# Compile
ENV EMCC_CFLAGS='-DLIBARCHIVE_STATIC'
RUN emcc -c ./wrapper.c -I "${SYSROOT}/include" $CFLAGS
RUN mkdir wasm
RUN printf "\n// @ts-nocheck\n" >pre.js
RUN printf "\nexport const wasm = await wasmFactory()\n" >post.js
RUN emcc ./wrapper.o \
	"${SYSROOT}/lib/libarchive.a" \
	"${SYSROOT}/lib/liblz4.a" \
	"${SYSROOT}/lib/liblzo2.a" \
	"${SYSROOT}/lib/liblzma.a" \
	"${SYSROOT}/lib/libzstd.a" \
	"${SYSROOT}/lib/libmbedtls.a" \
	"${SYSROOT}/lib/libmbedx509.a" \
	"${SYSROOT}/lib/libmbedcrypto.a" \
	-o ./wasm/libarchive.mjs $CFLAGS --lto --pic --strip-all --extern-pre-js=/src/pre.js --extern-post-js=/src/post.js \
	-s USE_ZLIB=1 \
	-s USE_BZIP2=1 \
	-s POLYFILL=0 \
	-s EXPORT_ES6=1 \
	-s INVOKE_RUN=0 \
	-s ASSERTIONS=1 \
	-s MODULARIZE=1 \
	-s TEXTDECODER=2 \
	-s EXPORT_NAME=wasmFactory \
	-s EXPORTED_FUNCTIONS=@/src/lib.exports \
	-s STACK_OVERFLOW_CHECK=2 \
	-s INCOMING_MODULE_JS_API=[] \
	-s EMIT_PRODUCERS_SECTION=1 \
	-s EMIT_EMSCRIPTEN_LICENSE=1 \
	-s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAP8,HEAP_DATA_VIEW

# --

FROM scratch

COPY --from=wrapper /src/wasm /
