task :serve do 
    Dir.chdir('web-ui') do
        sh "browser-sync start --server --files ./**/*.*"
    end
end

task :default => :serve
