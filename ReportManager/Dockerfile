# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Install Node.js for React build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy project file for dependency caching
COPY *.csproj .
RUN dotnet restore

# Copy everything and build
COPY . .

# Build React app first
WORKDIR /app/ClientApp
RUN npm ci --only=production
RUN npm run build

# Build .NET app
WORKDIR /app
RUN dotnet publish -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Railway
EXPOSE $PORT
ENV ASPNETCORE_URLS=http://*:$PORT

ENTRYPOINT ["dotnet", "ReportManager.dll"]