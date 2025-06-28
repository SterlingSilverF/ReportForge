# Use Microsoft's official .NET 8 SDK image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Create and set working directory inside the container
WORKDIR /app

# Install Node.js (needed for your React ClientApp build)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy ONLY the .csproj file first (for Docker layer caching)
COPY ReportManager/ReportManager.csproj ./ReportManager/
RUN dotnet restore "./ReportManager/ReportManager.csproj"

# Copy everything from your repository root to container
COPY . .

# Build the application (this will also build your React ClientApp)
RUN dotnet publish "./ReportManager/ReportManager.csproj" -c Release -o /app/publish

# Runtime stage - smaller image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Railway uses PORT environment variable
EXPOSE $PORT
ENV ASPNETCORE_URLS=http://*:$PORT

ENTRYPOINT ["dotnet", "ReportManager.dll"]